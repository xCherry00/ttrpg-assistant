package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CampaignRepository extends JpaRepository<CampaignEntity, Long> {

    Optional<CampaignEntity> findByJoinCodeAndDeletedAtIsNull(String joinCode);
    Optional<CampaignEntity> findByIdAndDeletedAtIsNull(Long id);

    @Query(value = """
            select distinct c.*
            from campaigns c
            left join campaign_members cm on cm.campaign_id = c.id
            where c.deleted_at is null
              and (c.owner_user_id = :userId or cm.user_id = :userId)
            order by c.updated_at desc, c.created_at desc
            """, nativeQuery = true)
    List<CampaignEntity> findVisibleForUser(@Param("userId") Long userId);

    long countByOwnerUserIdAndDeletedAtIsNull(Long ownerUserId);

    @Query(value = """
            select count(distinct c.id)
            from campaigns c
            left join campaign_members left_member on left_member.campaign_id = c.id
            left join campaign_members right_member on right_member.campaign_id = c.id
            where c.deleted_at is null
              and (c.owner_user_id = :leftUserId or left_member.user_id = :leftUserId)
              and (c.owner_user_id = :rightUserId or right_member.user_id = :rightUserId)
            """, nativeQuery = true)
    long countSharedCampaigns(@Param("leftUserId") Long leftUserId, @Param("rightUserId") Long rightUserId);

    @Query(value = """
            select count(distinct c.id)
            from campaigns c
            left join campaign_members cm on cm.campaign_id = c.id
            where c.deleted_at is null
              and (c.owner_user_id = :userId or cm.user_id = :userId)
            """, nativeQuery = true)
    long countVisibleForUser(@Param("userId") Long userId);
}
