package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CampaignMemberRepository extends JpaRepository<CampaignMemberEntity, CampaignMemberId> {

    List<CampaignMemberEntity> findByIdUserId(Long userId);
    List<CampaignMemberEntity> findByIdCampaignId(Long campaignId);

    @Query("""
            select count(member)
            from CampaignMemberEntity member
            where member.id.campaignId = :campaignId
            """)
    long countByCampaignId(@Param("campaignId") Long campaignId);

    @Query("""
            select count(member)
            from CampaignMemberEntity member
            where member.id.campaignId = :campaignId
              and member.id.userId <> :ownerUserId
            """)
    long countPlayersByCampaignId(@Param("campaignId") Long campaignId, @Param("ownerUserId") Long ownerUserId);

    @Query(value = """
            select distinct cm2.user_id
            from campaign_members cm1
            join campaign_members cm2 on cm2.campaign_id = cm1.campaign_id
            where cm1.user_id = :userId
              and cm2.user_id <> :userId
            """, nativeQuery = true)
    List<Long> findConnectedUserIds(@Param("userId") Long userId);
}
